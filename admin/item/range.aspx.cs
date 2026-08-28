using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.Data.OleDb;

public partial class admin_item_range : ez.admin.PageBase
{

    ez.admin.item item = new ez.admin.item();

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            BuildTreeView();

            int root = 0;
            if (!isStrNull(Request["num"]))
            {
                root = Val(Request["num"]);
            }
            Repeater1.DataSource = item.options(root, null);
            Repeater1.DataBind();
        }
       
    }

    #region 產生TreeView選單

    public void BuildTreeView()
    {
        this.TreeView1.Nodes.Clear();
        BuildChild(0, this.TreeView1.Nodes,1);
    }

    public void BuildChild(int RootUid, TreeNodeCollection Nodes, int level)
    {

        bool isLastLevel = (level + 1 >= item.maxLevel);

        DataTable dt = item.options(RootUid, null);
      
        for (int i = 0; i < dt.Rows.Count; i++)
        {

            TreeNode newNode = new TreeNode();

            if (ValString(Request["num"]) == dt.Rows[i]["num"].ToString() )
            {
                newNode.Text = "<b><span style=\"color:blue\">" + dt.Rows[i]["title"].ToString() + "</span></b>";          
            }
            else
            {
                newNode.Text = dt.Rows[i]["title"].ToString();
            }
            newNode.Value = dt.Rows[i]["num"].ToString();
            newNode.ShowCheckBox = false;
            newNode.NavigateUrl = "range.aspx?num=" + dt.Rows[i]["num"].ToString();
            newNode.Expand();
            Nodes.Add(newNode);
            if (!isLastLevel)
            {
                BuildChild((int)dt.Rows[i]["num"], newNode.ChildNodes, level + 1);
            }          

        }
      
    }

    #endregion

    #region 儲存

    protected void submitButton_Click(object sender, EventArgs e)
    {
        msg.Text = "";
        if (!isStrNull(sortNum.Value))
        {
            if (item.sort(sortNum.Value) && IsNumeric(sortNum.Value.Split(',')[0]))
            {
                ScriptMsg("儲存排序成功", Request.Url.AbsoluteUri);
            }
            else
            {
                ScriptMsg("儲存排序失敗");
                msg.Text =item.log;
            }
        }
        else
        {
            ScriptMsg("無排序資料");
        }
    }

    #endregion

  

    
}