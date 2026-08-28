using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.Data.OleDb;
using System.Collections;
using ez.data;

public partial class admin_pro_kind_reg : ez.admin.PageBase
{

    public store.kind pro_kind = new store.kind();

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            if (pro_kind.picMax > 0)
            {
                string[] pic = new string[pro_kind.picMax];
                picInit(pic);
            }

            ez.language lan = new ez.language();
            if (lan.Load())
            {
                lan.InitOptions(nation, nationPanel);
                if (!isStrNull(Request["nation"])) { nation.SelectedValue = ValString(Request["nation"]); }
            }

            BuildTreeView();

            //展開項目
            if (!isStrNull(Request["num"]))
            {
                formPanel.Visible = true;
                formPanel.Enabled = true;

                //載入資料        
                if (pro_kind.Load(Val(Request["num"])))
                {
                    mode.Value = "edit";

                    store.kind.DataInfo info = pro_kind.Data;
                    kind.Value = info.kind;
                    del.Visible = true;
                    HiddenField1.Value = info.kind;

                    if (pro_kind.picMax > 0) { picInit(info.pic); }
                }
                else
                {
                    msg.Text = pro_kind.log;
                    formPanel.Enabled = false;
                }

            }

        }

    }

    protected void nation_SelectedIndexChanged(object sender, EventArgs e)
    {
        Response.Redirect(Request.Url.AbsolutePath + "?nation=" + nation.SelectedValue);
    }

    #region 產生TreeView選單

    public void BuildTreeView()
    {
        this.TreeView1.Nodes.Clear();
        BuildChild(0, this.TreeView1.Nodes, 1);
    }

    public void BuildChild(int RootUid, TreeNodeCollection Nodes, int level)
    {

        bool isLastLevel = (level + 1 > pro_kind.LevelMax);

        ArrayList Rows = pro_kind.RowData(RootUid, nation.SelectedValue);

        foreach (store.kind.DataInfo info in Rows)
        {

            TreeNode newNode = new TreeNode();


            if (Val(Request["num"]) == info.num)
            {
                newNode.Text = "<b><span style=\"color:blue\">" + info.kind + "</span></b>";
                if (!isLastLevel)
                {
                    addSubOption.Visible = true;
                }

            }
            else
            {
                newNode.Text = info.kind;
            }
            newNode.Value = info.num.ToString();
            newNode.NavigateUrl = Request.Url.AbsolutePath + "?num=" + info.num.ToString() + "&nation=" + nation.SelectedValue;
            newNode.Expand();
            Nodes.Add(newNode);
            if (!isLastLevel)
            {
                BuildChild(info.num, newNode.ChildNodes, level + 1);
            }

        }


    }

    #endregion

    #region 表單預設

    void defForm()
    {
        kind.Value = "";
        mode.Value = "";
        msg.Text = "";
        addSubOption.Visible = false;
        del.Visible = false;
        string[] pic = new string[pro_kind.picMax];
        picInit(pic);
    }

    #endregion

    #region 建立選項

    protected void addRootOption_Click(object sender, EventArgs e)
    {
        defForm();  //初始化
        formPanel.Visible = true;
        mode.Value = "addRoot";
        Literal1.Text = "建立分類";
        navDiv.Visible = true;
    }

    protected void addSubOption_Click(object sender, EventArgs e)
    {
        defForm();  //初始化
        mode.Value = "addSub";
        Literal1.Text = "於「" + HiddenField1.Value + "」底下建立次選項";
        navDiv.Visible = true;
    }

    #endregion

    #region 新增/修改資料

    protected void submitButton_Click(object sender, EventArgs e)
    {
        if (Page.IsValid)
        {
            msg.Text = "";

            store.kind pro_kind = new store.kind();

            //圖片處理=====
            string[] pic = new string[1];
            if (pro_kind.picMax > 0)
            {
                ez.fileSystem fileSystem = new ez.fileSystem();
                string[] pic_name = fileSystem.UploadPhoto(pro_kind.Dir, 800);
                pic = new string[pro_kind.picMax];
                for (int i = 0; i < pro_kind.picMax; i++)
                {
                    HiddenField orgPic = (HiddenField)picRepeater.Items[i].FindControl("pic");  //目前已存在的檔案
                    CheckBox orgDel = (CheckBox)picRepeater.Items[i].FindControl("delpic");  //是否要刪除
                    pic[i] = orgPic.Value;
                    string delFile = "";
                    if (!isStrNull(pic_name[i]))
                    { pic[i] = pic_name[i]; delFile = orgPic.Value; }
                    else if (orgDel.Checked)
                    { pic[i] = ""; delFile = orgPic.Value; }
                    if (!isStrNull(delFile)) { fileSystem.Delete(pro_kind.Dir + delFile); }  //刪除舊檔
                }
            }

            //寫入資料====-
            store.kind.DataInfo info = new store.kind.DataInfo();
            info.nation = nation.SelectedValue;
            info.kind = kind.Value.Trim();

            bool subOption = addSubOption.Visible;

            if (pro_kind.picMax > 0)
            {
                info.pic = pic;
            }

            if (mode.Value == "addRoot")
            {
                info.root = 0;
                pro_kind.Data = info;
                if (pro_kind.Add())
                {
                    msg.Text = "新增成功";
                    BuildTreeView();
                }
                else { msg.Text = pro_kind.log; }
            }
            else if (mode.Value == "addSub")
            {
                info.root = Val(Request["num"]);
                pro_kind.Data = info;
                if (pro_kind.Add())
                {
                    msg.Text = "新增成功";
                    BuildTreeView();
                }
                else { msg.Text = pro_kind.log; }
            }
            else if (mode.Value == "edit")
            {
                info.num = Val(Request["num"]);
                pro_kind.Data = info;
                if (pro_kind.Edit())
                {
                    if (pro_kind.picMax > 0) { picInit(info.pic); }

                    msg.Text = "修改成功";
                    BuildTreeView();
                }
                else { msg.Text = pro_kind.log; }
            }

            if (msg.Text.IndexOf("成功") > -1)
            {
                ScriptJS("msgtop('" + Server.HtmlEncode(msg.Text) + "','success')");
                msg.Text = "";
            }
            else if (!isStrNull(msg.Text))
            {
                ScriptJS("msgtop('操作失敗','error')");
            }

            addSubOption.Visible = subOption;

        }
    }

    #endregion

    #region 刪除

    protected void del_Click(object sender, EventArgs e)
    {
        if (pro_kind.Del(Val(Request["num"]), true))
        {
            Response.Redirect(Request.Url.AbsolutePath + rtnQueryString("num"));
        }
        else
        {
            msg.Text = pro_kind.log;
        }
    }

    #endregion

    #region 圖片

    protected void picInit(string[] pic)
    {
        DataTable picDt = new DataTable();
        picDt.Columns.Add("row");
        picDt.Columns.Add("pic");
        for (int i = 0; i < pic.Length; i++)
        {
            DataRow tr = picDt.NewRow();
            tr["row"] = i + 1;
            tr["pic"] = (!isStrNull(pic[i]) ? pic[i] : "");
            picDt.Rows.Add(tr);
        }
        picRepeater.DataSource = picDt;
        picRepeater.DataBind();
    }

    protected void picRepeater_ItemDataBound(object sender, RepeaterItemEventArgs e)
    {
        DataRowView row = (DataRowView)e.Item.DataItem;
        if (!isStrNull(row["pic"]))
        {
            store.kind pro_kind = new store.kind();
            ((CheckBox)e.Item.FindControl("delpic")).Visible = true;
            ((HyperLink)e.Item.FindControl("HyperLink1")).Visible = true;
            ((HyperLink)e.Item.FindControl("HyperLink1")).NavigateUrl = pro_kind.Dir + row["pic"].ToString();
            ((Image)e.Item.FindControl("Image1")).ImageUrl = pro_kind.Dir + row["pic"].ToString();
        }
    }

    #endregion

}