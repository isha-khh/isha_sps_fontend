using ez.data;
using System;
using System.Web.UI;
using System.Web.UI.WebControls;

public partial class admin_pro_reg : ez.admin.PageBase
{

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {

            where_to_use where_to_use = new where_to_use();

            ez.language lan = new ez.language();
            if (lan.Load())
            {
                lan.InitOptions(nation, nationPanel);
            }

            kind.Items.Clear();
            kind.Items.Add(new ListItem(""));
            where_to_use.initKindOptions(kind); 
            where_to_use.initStatusOptions(status);
            if (status.Items.Count > 0) { status.SelectedIndex = 0; }            

            if (!isStrNull(Request["num"]))
            {
                if (where_to_use.Load(Val(Request["num"])))
                {
                    mode.Value = "edit";
                    where_to_use.DataInfo info = where_to_use.Data;
                    nation.SelectedValue = info.nation;
                    if (info.kind.HasValue) { kind.SelectedValue = info.kind.Value.ToString(); }
                    subject.Value = info.subject;
                    if (info.use_value.HasValue) { use_value.Value = info.use_value.Value.ToString(); }
                    status.SelectedValue = info.status;
                }
                else
                {
                    Response.Write(where_to_use.log);
                    ScriptMsg("查無資料", "index.aspx" + rtnQueryString("num"));
                }
                goBack.Visible = true;
                goBack.NavigateUrl = "index.aspx" + rtnQueryString("num");

            }
            else
            {
                mode.Value = "add";
            }
        }

    }

    #region 新增/修改資料

    protected void submitButton_Click(object sender, EventArgs e)
    {
        if (Page.IsValid)
        {

            msg.Text = "";

            where_to_use where_to_use = new where_to_use();
            where_to_use.DataInfo info = new where_to_use.DataInfo();
            info.nation = nation.SelectedValue;
            info.subject = subject.Value.Trim();
            info.kind = Val(kind.SelectedValue);
            info.use_value = ValFloat(use_value.Value.Trim());
            info.status = status.SelectedValue;

            switch (mode.Value)
            {
                case "add":
                    where_to_use.Data = info;
                    if (where_to_use.Add())
                    {
                        Response.Redirect("index.aspx");
                    }
                    else { msg.Text = where_to_use.log; }
                    break;
                case "edit":
                    info.num = Val(Request["num"]);
                    where_to_use.Data = info;
                    if (where_to_use.Edit())
                    {
                        Response.Redirect("index.aspx" + rtnQueryString("num"));
                    }
                    else { msg.Text = where_to_use.log; }
                    break;
                default:
                    break;
            }

        }
    }

    #endregion




}